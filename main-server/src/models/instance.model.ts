import mongoose,{Schema} from "mongoose"

export const instanceSchema = new Schema({
  username:{
    type:String,
    required:true,
    unique:true
  },
  password:{
    type:String,
    required:true,
  },
  opearatingSystem:{
    type:String
  },
  labName:{
    type:String
  },
  maxContainers:{
    type:Number,
    default:10
  }
},{
  timestamps:true,
})

const Instance = mongoose.model("Instance",instanceSchema);

export default Instance;