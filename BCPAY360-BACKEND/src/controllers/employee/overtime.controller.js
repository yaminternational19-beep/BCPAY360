import db from "../../config/db.js";
import logger from "../../utils/logger.js";

const MODULE_NAME = "OVERTIME_CONTROLLER";

const SESSION = {
    IN_PROGRESS: 1,
    COMPLETED: 2
};

const ACTION = {
    CHECK_IN: 1,
    CHECK_OUT: 2,
    OT_START: 4,
    OT_STOP: 5
};

// IST Helper (matching attendance controller)
const getISTNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

const formatDateTime = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
};

const getShiftDateTimes = (dateStr, startTime, endTime, isNightShift) => {
    const [sH, sM, sS] = startTime.split(':').map(Number);
    const [eH, eM, eS] = endTime.split(':').map(Number);
    const start = new Date(dateStr);
    start.setHours(sH, sM, sS || 0, 0);
    const end = new Date(dateStr);
    end.setHours(eH, eM, eS || 0, 0);
    if (isNightShift) end.setDate(end.getDate() + 1);
    return { start, end };
};

export const startOvertime = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const employeeId = req.user.id;
        const { latitude, longitude } = req.body;
        const now = getISTNow();
        const nowStr = formatDateTime(now);
        
        const [rows] = await conn.query(`
            SELECT a.*, s.end_time, s.start_time, s.is_night_shift
            FROM attendance a
            JOIN shifts s ON s.id = a.shift_id
            WHERE a.employee_id = ?
            ORDER BY a.attendance_date DESC LIMIT 1
        `, [employeeId]);
        
        if (!rows.length) {
            return res.status(400).json({ success: false, message: "No attendance found to start OT" });
        }
        const att = rows[0];
        
        if (att.session_status !== SESSION.COMPLETED) {
            return res.status(400).json({ success: false, message: "Shift not completed yet" });
        }
        
        const { end: shiftEndDT } = getShiftDateTimes(formatDateTime(att.attendance_date).slice(0, 10), att.start_time, att.end_time, att.is_night_shift);
        
        if (now < shiftEndDT) {
            return res.status(400).json({ success: false, message: "Cannot start OT before shift ends" });
        }
        
        const [openOt] = await conn.query(`
            SELECT id FROM overtime_logs
            WHERE employee_id = ? AND overtime_end IS NULL
        `, [employeeId]);
        
        if (openOt.length > 0) {
            return res.status(400).json({ success: false, message: "Overtime already in progress" });
        }

        await conn.beginTransaction();
        
        await conn.query(`
            INSERT INTO overtime_logs (attendance_id, employee_id, overtime_start)
            VALUES (?, ?, ?)
        `, [att.id, employeeId, nowStr]);
        
        await conn.query(`
            INSERT INTO attendance_logs (attendance_id, employee_id, action_type, action_time, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [att.id, employeeId, ACTION.OT_START, nowStr, latitude, longitude]);

        await conn.commit();
        
        return res.json({ success: true, message: "Overtime started" });
        
    } catch (err) {
        if (conn) await conn.rollback();
        logger.error(MODULE_NAME, "Start overtime error", err);
        return res.status(500).json({ success: false, message: "Server error" });
    } finally {
        conn.release();
    }
};

export const stopOvertime = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const employeeId = req.user.id;
        const { latitude, longitude } = req.body;
        const now = getISTNow();
        const nowStr = formatDateTime(now);
        
        const [otRows] = await conn.query(`
            SELECT o.*
            FROM overtime_logs o
            WHERE o.employee_id = ? AND o.overtime_end IS NULL
            ORDER BY o.id DESC LIMIT 1
        `, [employeeId]);
        
        if (!otRows.length) {
            return res.status(400).json({ success: false, message: "No active overtime found" });
        }
        
        const ot = otRows[0];
        const otStartDT = new Date(ot.overtime_start);
        const durationMinutes = Math.floor((now - otStartDT) / 60000);
        
        if (durationMinutes < 30) {
            return res.status(400).json({ success: false, message: "Minimum 30 minutes of overtime required before you can stop." });
        }

        let insertDuration = durationMinutes;
        
        // Rules: 60 min minimum for OT? 
        // User update: durationMinutes < 1 (kept as is for counts)
        if (durationMinutes < 1) { 
            insertDuration = 0; 
        } else if (durationMinutes > 240) {
            insertDuration = 240; // Cap at 4 hours max per session
        }
        
        await conn.beginTransaction();
        
        await conn.query(`
            UPDATE overtime_logs
            SET overtime_end = ?, duration_minutes = ?
            WHERE id = ?
        `, [nowStr, insertDuration, ot.id]);
        
        await conn.query(`
            UPDATE attendance
            SET overtime_minutes = overtime_minutes + ?
            WHERE id = ?
        `, [insertDuration, ot.attendance_id]);
        
        await conn.query(`
            INSERT INTO attendance_logs (attendance_id, employee_id, action_type, action_time, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [ot.attendance_id, employeeId, ACTION.OT_STOP, nowStr, latitude, longitude]);

        await conn.commit();
        
        return res.json({ 
            success: true, 
            message: insertDuration === 0 ? "Overtime stopped (Ignored: less than 1 hour)" : "Overtime stopped",
            duration: insertDuration
        });
        
    } catch (err) {
        if (conn) await conn.rollback();
        logger.error(MODULE_NAME, "Stop overtime error", err);
        return res.status(500).json({ success: false, message: "Server error" });
    } finally {
        conn.release();
    }
};
