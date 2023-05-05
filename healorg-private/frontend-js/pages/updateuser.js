import { Space, Table, Tag } from 'antd';
import auth from "../lib/auth";
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';

import SetData from "../components/SetData";
var jwt = require('jsonwebtoken');

export default function UpdateUser() {
    const router = useRouter();
    const [data,setData] = useState({value: null});
    useEffect(() => {
        let res = auth(router.query.name);
        if (res == null) {
            router.push('/login');
        } else setData(res);
    
    }, [router.query])

    const onFinish = async (e) => {
      e.preventDefault();
      const url = "http://localhost:5000/updateUser"
      const data = {
          id: e.target.userid.value,
          email: e.target.user_email.value,
          phn: e.target.phone_num.value,
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
          alert(error);
      } else {
          localStorage.removeItem("token");
          var token = jwt.sign(result, 'secret123', { expiresIn: '1h' });
          localStorage.setItem('token', token);
          router.push('/');
      }
    };
  
  const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
  const [form] = useRef();
  return (
   <html>
        <head>
          <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.2.1/css/bootstrap.min.css" />

          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous" />

      </head>
      <body>
        <form ref={form} className="contact-form" onSubmit={onFinish}>
        <SetData data={data} />
        </form>
      </body>
    </html>
  );
}