// Test CORS connection
export const testCorsConnection = async () => {
    const API_URL = import.meta.env.VITE_API_URL;

    try {
        console.log('🔍 Testing CORS connection...');
        console.log('📡 API URL:', API_URL);

        const response = await fetch(`${API_URL}/test-cors`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include', // For Sanctum cookies
        });

        const data = await response.json();
        console.log('✅ CORS test successful:', data);
        return data;
    } catch (error) {
        console.error('❌ CORS test failed:', error);
        return { error: error.message };
    }
};

// Test Sanctum CSRF
export const testSanctumCsrf = async () => {
    const APP_URL = 'http://127.0.0.1:8000';

    try {
        console.log('🔐 Testing Sanctum CSRF...');

        const response = await fetch(`${APP_URL}/sanctum/csrf-cookie`, {
            method: 'GET',
            credentials: 'include',
        });

        console.log('✅ CSRF cookie set:', response.ok);
        return response.ok;
    } catch (error) {
        console.error('❌ CSRF test failed:', error);
        return false;
    }
};