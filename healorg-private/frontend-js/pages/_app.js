import 'antd/dist/reset.css';
import '../styles/globals.css';



import React, { useEffect , useState } from 'react';
import LeftSideBar from "../components/LeftSideBar";
import { Breadcrumb, Layout, Menu } from 'antd';
import { useRouter } from 'next/router';


const { Header, Content, Footer } = Layout;


function MyApp({ Component, pageProps }) {
  const [user,setUser] = useState({value: null});
  const router = useRouter();
  

   useEffect(() => {
    let token = localStorage.getItem('token');
    if (token) {
      setUser({ value: token });
    }
   },[router.query])

  return (
    <Layout
      style={{
        minHeight: '100vh',
      }}
    >
     <LeftSideBar user={user} setUser={setUser}/>
      <Layout className="site-layout">
        <Header
          className="site-layout-background"
          style={{
            padding: 0,
          }}
        />
        <Content
          style={{
            margin: '0 16px',
          }}
        >
          <Breadcrumb
            style={{
              margin: '16px 0',
            }}
          >
            <Breadcrumb.Item>User</Breadcrumb.Item>
            <Breadcrumb.Item>Bill</Breadcrumb.Item>
          </Breadcrumb>
          <div
            className="site-layout-background"
            style={{
              padding: 24,
              minHeight: 360,
            }}
          >
             <Component {...pageProps} />
          </div>
        </Content>
        <Footer
          style={{
            textAlign: 'center',
          }}
        >
          Ant Design ©2018 Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );


}

export default MyApp