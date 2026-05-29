import axios from "axios"

const axiosClient = axios.create({
    baseURL: 'https://four9leetcode.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default axiosClient;

