import {
  Button,
  Form,
  Input,
  InputNumber,
} from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import auth from "../lib/auth";

const formItemLayout = {
  labelCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 8,
    },
  },
  wrapperCol: {
    xs: {
      span: 24,
    },
    sm: {
      span: 16,
    },
  },
};
const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};
const ChangePass = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  let res;
  useEffect(() => {
      res = auth(router.query.name);
      console.log(res.id);
      if (res == null) {
          router.push('/login');
      }
    }, [router.query])
  const onFinish = async (values) => {
    const url = "http://localhost:5000/updateUser"
      const data = {
          id: res.id,
          password: values.password,
          org: res.org,
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
          router.push('/');
      }
  };
  return (
    <Form
      {...formItemLayout}
      form={form}
      name="register"
      onFinish={onFinish}
      style={{
        maxWidth: 600,
      }}
      scrollToFirstError
    >

      <Form.Item
        name="password"
        label="Password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
        ]}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="confirm"
        label="Confirm Password"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Please confirm your password!',
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords that you entered do not match!'));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
      
      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">
          Update
        </Button>
      </Form.Item>
    </Form>
  );
};
export default ChangePass;