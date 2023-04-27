import { Space, Table, Tag } from 'antd';
import auth from "../lib/auth";
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import PrescriptionData from "../components/PrescriptionData";

export default function Preslist(props) {
    const router = useRouter();
    const [prescription, setPrescription] = useState([]);

    const url = "http://localhost:5000/findprescription"
    let res;
    useEffect(() => {
        res = auth(router.query.name);

        if (res == null) {
            router.push('/login');
        } else if (res.usertype != 'doctor') {
            router.push('/');
        } else fetchData();


    }, [router.query])

    const fetchData = async (values) => {

        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                assettype: "ValuableAsset",
                docid: res.id,
                org: res.org,
            })
        });
        const data = await response.json();
        if ('error' in data) {
            router.push('/rt');
        } else if (data.length > 0) {
          console.log(data);
            setPrescription(data);
        }
    };

    return < >
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.2.1/css/bootstrap.min.css" />

          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous" />

      </head>
      <body>
        <table class="table">
          <thead class="thead-dark">
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Patient id</th>
              <th scope="col">Patient Name</th>
              <th scope="col">Disease</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            <PrescriptionData prescription={prescription} />
          </tbody>
        </table>
        </body>
        </html>
        </>

}