import axios from "axios";

export default function checkLoggedIn() {
    axios.get("http://localhost:3000/login", { withCredentials: true }).then(response => {
        //if(response.data.login && this.state.lo)
        console.log("login?",response);
    }).catch(error => {
        console.log("check error", error);
    });
}