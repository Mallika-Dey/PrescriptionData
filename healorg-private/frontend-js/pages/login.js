import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'



import { Button, Checkbox, Form, Input, Select } from 'antd';
const { Option } = Select;

export default function Login() {
  const onFinish = (values) => {
    console.log('Success:', values);
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
        name="userid"
        rules={[
          {
            required: true,
            message: 'Please input your userid!',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="organization"
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
          <Option value="Org1">Org1</Option>
          <Option value="Org2">Org2</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="remember"
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
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
