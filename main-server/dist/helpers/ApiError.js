export default class ApiError {
    status;
    message;
    error;
    constructor(status, message, error) {
        this.status = status;
        this.message = message;
        if (error) {
            this.error = error;
        }
    }
}
//# sourceMappingURL=ApiError.js.map