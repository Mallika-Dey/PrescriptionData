import { PlusOutlined } from '@ant-design/icons';
import {
    Button,
    Cascader,
    Checkbox,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
} from 'antd';
import { useState } from 'react';
const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function VerifySig() {
    //const [componentDisabled, setComponentDisabled] = useState(true);
    const onFinish = async (values) => {

        const url = "http://localhost:5000/createprescription"

        const data = {
            id: values.data.id,
            pid: values.data.pid,
            did: values.data.did,
            name: values.data.name,
            docname: values.data.docname,
            age: values.data.age,
            date: values.data.date.toString(),
            symtomp: values.data.symtomp,
            disease: values.data.disease,
            medicine: values.data.medicine,
            available: values.data.available,
            org: values.data.org,
        }

         const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            withCredentials: false,
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
    };
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return ( <
        >
        <Form
        labelCol={{
          span: 8,
        }}
        wrapperCol={{
          span: 14,
        }}
        layout="horizontal"
        //disabled={componentDisabled}
        style={{
          maxWidth: 600,
        }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item label="ID" 
         name={['data', 'id']}
         rules={[
          {
            required: true,
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="PID"
        name={['data', 'pid']}
        rules={[
          {
            required: true,
            message: "Enter patient's userid!",
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="DocID"
        name={['data', 'did']}
        rules={[
          {
            required: true,
            message: "Enter your userid!",
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="Patient Name" 
        name={['data', 'name']}
        rules={[
          {
            required: true,
            message: "Enter patient's name!",
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="Doctor Name" 
        name={['data', 'docname']}
        rules={[
          {
            required: true,
            message: 'Enter your name!',
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="Age" 
        name={['data', 'age']}
        rules={[
          {
            required: true,
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="Date"
        name={['data', 'date']}
        rules={[
          {
            required: true,
          },
        ]}>
          <DatePicker />
        </Form.Item>

        <Form.Item label="Symtomp"
        name={['data', 'symtomp']}
        rules={[
          {
            required: true,
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="Disease"
        name={['data', 'disease']}
        rules={[
          {
            required: true,
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="Medicine"
        name={['data', 'medicine']}
        rules={[
          {
            required: true,
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item label="Available"
        name={['data', 'available']}
        rules={[
          {
            required: true,
          },
        ]}>
          <InputNumber />
        </Form.Item>

        <Form.Item label="Organization"
        name={['data', 'org']}
        rules={[
          {
            required: true,
          },
        ]}>
          <Select>
            <Select.Option value="Org1MSP">Org1MSP</Select.Option>
            <Select.Option value="Org2MSP">Org2MSP</Select.Option>
          </Select>
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
      </Form> <
        />
    );
};