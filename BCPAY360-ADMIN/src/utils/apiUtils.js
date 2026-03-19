export const handleApiError = async (response) => {
    if (response.ok) return response.json();

    let message = "Something went wrong";
    try {
        const errorData = await response.json();
        message = errorData.message || errorData.error || message;
    } catch (e) {
        // If not JSON, use status text
        message = response.statusText || message;
    }

    throw new Error(message);
};

export const wrapApiCall = async (apiCall) => {
    try {
        const response = await apiCall();
        return await handleApiError(response);
    } catch (error) {
        throw error;
    }
};
