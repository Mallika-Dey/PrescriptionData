import {
    DesktopOutlined,
    FileOutlined,
    HomeOutlined,
    TeamOutlined,
    UserOutlined,
    LoginOutlined,
    LogoutOutlined,
} from '@ant-design/icons';

import { useEffect, useState, useRef } from 'react';
import { Layout, Menu } from 'antd';
import { useRouter } from 'next/router';
import LoadingBar from 'react-top-loading-bar';
const { Sider } = Layout;


export default function LeftSideBar({ user }) {

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
        <h2 className="logo">Healthorg</h2>

        <Menu theme = "dark" mode = "inline" >
        <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => router.push('/')}>
            Home
        </Menu.Item> 
        <Menu.Item key = "2" icon = { <TeamOutlined /> } onClick = {() => router.push('/login')} >
        Team 
        </Menu.Item> 
        <Menu.Item key = "3" icon = { <FileOutlined /> } onClick = {() => router.push('/myFiles')} >
        My Files 
        </Menu.Item> 
        {!user.value && <Menu.Item key="4" icon={<LoginOutlined / >} onClick = {() => router.push('/login')} >
            Login 
        </Menu.Item> }

        { user.value && <Menu.Item key="4" icon={<LogoutOutlined/>} onClick={() => {
                    localStorage.removeItem("token");
                    setUser({value: null});
                    router.push('/')}}>
                    Logout
                </Menu.Item> } 
        </Menu> </Sider > 
        </>
}