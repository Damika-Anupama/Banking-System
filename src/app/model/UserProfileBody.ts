// import { DateDescendObject } from "./DateDescendObject";
// import { Gender } from "./Gender";
// import { onlineStatus } from "./OnlineStatus";
// import { Relationship } from "./Relationship";
// import { Role } from "./Role";

 export interface UserProfileBody {
    // implicitly setting data
    id:Number;
    createdDate:string;
    isActive:boolean;
    // role:Role;
    updatedDate:Date;
    lastLogin:Date;
    // onlineStatus:onlineStatus;
    //explicitly setting data
    username:string;
    fullName:string;
    // gender:Gender;
    email:string;
    shortDescription:string;
    profilePicture:FileList;
    contactNum:string;
    location:string;
    education:string;
    skills:string;
    dob:Date;
    // relationship:Relationship;

    //other details of the user
    noOfCommunities:Number;
    noOfFriends:Number;
    noOfLaunches:Number;

    // full details about the other objects according to their created date
    // dateDescendObjects:DateDescendObject[];
  }
  