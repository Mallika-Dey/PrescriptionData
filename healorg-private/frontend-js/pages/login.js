import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useRouter } from 'next/router';
//import useUser from "../lib/useUser";


import { Button, Checkbox, Form, Input, Select } from 'antd';
const { Option } = Select;

var jwt = require('jsonwebtoken');

export default function Login() {

    const router = useRouter();

    const onFinish = async (values) => {

        const url = "http://localhost:5000/login"
        const { organization, password, remember, userid } = values.user;

        const data = {
            organization: organization,
            password: password,
            userid: userid,
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
            console.log(result.error)
            alert('wrong id, organization, or password');
        } else {
            var token = jwt.sign(result, 'secret123', { expiresIn: '1h' });
            localStorage.setItem('token', token);
            router.push('/');
        }

    };
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    
    return (
        <Form
      name="basic"
      labelCol={{
        span: 8,
      }}
      wrapperCol={{
        span: 16,
      }}
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item
        label="Userid"
        name={['user', 'userid']}
        rules={[
          {
            required: true,
            message: 'Please input your userid!',
          },
        ]}
      >
        <Input placeholder="Enter your userid"/>
      </Form.Item>

      <Form.Item
        name={['user',"organization"]}
        label="Organization"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select
          placeholder="Select a organization"
          allowClear
        >
          <Option value="Org1MSP">Org1MSP</Option>
          <Option value="Org2MSP">Org2MSP</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Password"
        name={['user',"password"]}
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
        ]}
      >
        <Input.Password placeholder="Enter password"/>
      </Form.Item>

      <Form.Item
        name={['user',"remember"]}
        valuePropName="checked"
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Button type="primary" htmlType="submit">
          Log In
        </Button>
      </Form.Item>
    </Form>
    );
}