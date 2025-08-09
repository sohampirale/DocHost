export default class ApiResponse {
    success;
    message;
    data;
    error;
    constructor(success, message, data, error) {
        this.success = success;
        this.message = message;
        if (data) {
            this.data = data;
        }
        if (error) {
            this.error = error;
        }
    }
}
//# sourceMappingURL=ApiResponse.js.map