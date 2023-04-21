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
            setPrescription(data);
        }
    };

    return < >
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient id</th>
              <th>Patient Name</th>
              <th>Disease</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <PrescriptionData prescription={prescription} />
          </tbody>
        </table>

        </>

}