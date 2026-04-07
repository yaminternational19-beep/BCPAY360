import logger from "../../utils/logger.js";

const MODULE_NAME = "PUBLIC_SUPPORT";

/* =========================================================
   POST /api/public/support
   Public endpoint — MOCK response
   Simulates support request submission from bcpay360.com/support
========================================================= */
export const submitPublicSupportTicket = async (req, res) => {
  try {
    const { firstName, lastName, email, category, subject, message } = req.body;

    logger.info(MODULE_NAME, "Mock support ticket received", { firstName, email, category });

    // Simulate quick processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return res.status(201).json({
      success: true,
      message: "Support ticket received! This is a mock response — in a real setup, your request would be saved to a database.",
      data: {
        ticketId: Math.floor(Math.random() * 1000000),
        referenceCode: `MOCK-${Date.now().toString().slice(-6)}`,
      },
    });

  } catch (error) {
    logger.error(MODULE_NAME, "Mock submission failed", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process mock request.",
    });
  }
};
