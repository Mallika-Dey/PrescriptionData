import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input } from 'antd';

export default function VerifySig() {
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
            console.log(result.error);
            alert(result.error);
        } 
        console.log(result);
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
        label="public key"
        rules={[
          {
            required: true,
            message: 'Public key of Doctor!',
          },
        ]}
      >
       <Input 
       		type="text" placeholder="Public key of Doctor" 
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