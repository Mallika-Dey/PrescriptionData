import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import sendmail from "../components/sendmail";

const CreateUser = () => {
  const [form] = useRef();
  const router = useRouter();

  useEffect(() => {
        let res = auth(router.query.name);

        if (res == null) {
            router.push('/login');
        } else if (res.usertype != 'admin') {
            router.push('/');
        }

    }, [router.query])

  const onFinish = async (e) => {
    e.preventDefault();
    const url = "http://localhost:5000/register"
    const data = {
        id: e.target.userid.value,
        name: e.target.user_name.value,
        gender: e.target.gender.value,
        email: e.target.user_email.value,
        password: e.target.pass.value,
        phn: e.target.phone_num.value,
        usertype: e.target.usertype.value,
        org: e.target.org.value,
    }

    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if ('error' in result) {
        alert('registration failed');
    } else {
        router.push('/user');
    }
    sendmail(e);
  };
  
  const [autoCompleteResult, setAutoCompleteResult] = useState([]);

  return (
   <html>
        <head>
          <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.2.1/css/bootstrap.min.css" />

          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous" />

      </head>
      <body>
        <form ref={form} className="contact-form" onSubmit={onFinish}>
          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="org">Organization</label>
              <select id="org" name="org" class="form-control" required>
                <option value="Org1MSP">Org1MSP</option>
                <option value="Org2MSP">Org2MSP</option>
              </select>
            </div>

            <div class="form-group col-md-4">
              <label for="usertype">Usertype</label>
              <select id="usertype" name="usertype" class="form-control" required>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </select>
            </div>

          </div>

          <div class="form-group">
            <label for="userid">UserID</label>
            <input type="text" class="form-control" id="userid" name="userid" placeholder="Input user id" required />
          </div>

          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="username">Name</label>
              <input type="text" class="form-control" id="username" name="user_name" placeholder="Input User Name" required />
            </div>
            <div class="form-group col-md-4">
              <label for="inputPassword4">Password</label>
              <input type="password" class="form-control" name="pass" id="inputPassword4" placeholder="Input Password" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="inputEmail4">Email</label>
              <input type="email" name="user_email" class="form-control" id="inputEmail4" placeholder="Email" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="phone_num">Contact No</label>
              <input type="text" name="phone_num" class="form-control" id="phone_num" placeholder="Contact No" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group col-md-4">
              <label for="gender">Gender</label>
              <select id="gender" name="gender" class="form-control" required>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
             </div>
          </div>
          <button type="submit" class="btn btn-primary">Register</button>
        </form>
      </body>
    </html>
  );
};
export default CreateUser;