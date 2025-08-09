export default class ApiError{
  status:number;
  message:string;
  error?:any;
  constructor(status:number,message:string,error?:any){
    this.status=status
    this.message=message;
    if(error){
      this.error=error;
    }
  }
}