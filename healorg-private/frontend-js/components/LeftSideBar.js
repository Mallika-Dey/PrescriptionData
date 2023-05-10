import {
    DesktopOutlined,
    FileOutlined,
    HomeOutlined,
    TeamOutlined,
    UserOutlined,
    LoginOutlined,
    LogoutOutlined,
    KeyOutlined,
} from '@ant-design/icons';

import { useEffect, useState, useRef } from 'react';
import { Layout, Menu } from 'antd';
import { useRouter } from 'next/router';
import LoadingBar from 'react-top-loading-bar';
const { Sider } = Layout;
import auth from "../lib/auth";


export default function LeftSideBar({ user, setUser }) {

    const router = useRouter();
    const ref = useRef(null)
    const [progress, setProgress] = useState(0)

    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        router.events.on('routeChangeStart', () => {
            setProgress(40)
        })
        router.events.on('routeChangeComplete', () => {
            setProgress(100)
        })
    })

    let res = auth( user.value );

    return < >
        <LoadingBar
        color='#4C2BAB'
        height=".6%"
        progress={progress}
        waitingTime={400}
        onLoaderFinished={() => setProgress(0)}
      />


      <Sider collapsible collapsed = { collapsed } onCollapse = {
            (value) => setCollapsed(value)
        } >
        <h2 className="logo">Healthcare</h2>

        <Menu theme = "dark" mode = "inline" >
        <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => router.push('/')}>
            Home
        </Menu.Item> 
        <Menu.Item key = "2" icon = { <TeamOutlined /> } onClick = {() => router.push('/login')} >
        Team 
        </Menu.Item> 
        { user.value && res!=null && res.usertype=='doctor' && <Menu.Item key = "3" icon = { <FileOutlined /> } onClick = {() => router.push('/createprescription')} >
        New Prescription 
        </Menu.Item>  }
        { user.value && res!=null && res.usertype=='doctor' && <Menu.Item key = "4" icon = { <FileOutlined /> } onClick = {() => router.push({
        pathname: '/preslist', query: { name: user.value }})} >
        View Prescription 
        </Menu.Item>  }

        {user.value && res!=null && <Menu.Item key="5" icon={<UserOutlined />} onClick={() => router.push({pathname:'/updateuser', query: { name: user.value }})}>
                    UpdateProfile
                </Menu.Item>} 

        {user.value && res!=null && <Menu.Item key="6" icon={<KeyOutlined />} onClick={() => router.push({pathname:'/changepass', query: { name: user.value }})}>
                    ChangePass
                </Menu.Item>} 

        {res!=null && <Menu.Item key="7" icon={<KeyOutlined />} onClick={() => router.push({pathname:'/verifysig', query: { name: user.value }})}>
                    Verify Signature
                </Menu.Item>} 
                
        {res==null  && <Menu.Item key="5" icon={<LoginOutlined / >} onClick = {() => router.push('/login')} >
            Login 
        </Menu.Item> }
        { res!=null && <Menu.Item key="8" icon={<LogoutOutlined/>} onClick={() => {
                    localStorage.removeItem("token");
                    setUser({value: null});
                    res=null;
                    router.push('/')}}>
                    Logout
                </Menu.Item> }
        </Menu> </Sider > 
        </>
}