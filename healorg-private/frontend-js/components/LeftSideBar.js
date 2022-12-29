import {
  DesktopOutlined,
  FileOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  LoginOutlined,
} from '@ant-design/icons';

import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {useRouter} from 'next/router';
const {Sider} = Layout;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}
const items = [
  getItem('Home', '1', <HomeOutlined />),
  getItem('Login', '2', <LoginOutlined />),
  getItem('User', 'sub1', <UserOutlined />, [
    getItem('Tom', '3'),
    getItem('Bill', '4'),
    getItem('Alex', '5'),
  ]),
  getItem('Team', 'sub2', <TeamOutlined />, [getItem('Team 1', '6'), getItem('Team 2', '7')]),
  getItem('Files', '8', <FileOutlined />),
];

const onclick = [
  '/', '/login', '/createuser', '/login', '/login',
   '/login', '/login', '/login'
];

export default function LeftSideBar() {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
   const onClick = (e) => {
    //console.log('click ', e);
    console.log(e.key);
   // setCurrent(e.key);
    router.push(`${onclick[e.key-1]}`)
  };
	return (
		 <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <h2 className="logo">Health Organization</h2>
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} onClick = {onClick} />
      </Sider>
	)
}