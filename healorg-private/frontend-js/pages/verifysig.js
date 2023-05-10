import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import auth from "../lib/auth";

export default function VerifySig() {

    let res;
    const router = useRouter();
    useEffect(() => {
        res = auth(router.query.name);

        if (res == null) {
            router.push('/login');
        } else if (res.usertype != 'doctor') {
            router.push('/');
        }

    }, [router.query])

    const onFinish = async (values) => {
        const url = "http://localhost:5000/verifysig"
        const data = {
            txid: values.txid,
            pubkey: values.pubkey.replaceAll("\\n","\n"),
        }
        const response = await fetch(url, {
            method: 'post',
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
            router.push('/failed')
        } 
        else router.push('/verified')
    };
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    return (
        <Form
      name="normal_login"
      className="login-form"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        name="txid"
        label="TXID"
        rules={[
          {
            required: true,
            message: 'TXID of prescription!',
          },
        ]}
      >
       <Input  
       		placeholder="TXID of prescription" 
       	/>
      </Form.Item>

      <Form.Item
        name="pubkey"
        label="Certificate"
        rules={[
          {
            required: true,
            message: 'Certificate of Doctor!',
          },
        ]}
      >
       <Input 
       		type="text" placeholder="Certificate of Creator" 
       	/>
      </Form.Item>
      

      <Form.Item>
        <Button htmlType="submit">
          Verify
        </Button>
      </Form.Item>
    </Form>
    );
}