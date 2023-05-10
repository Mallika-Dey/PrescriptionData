import { Button, Result } from 'antd';
const Verified = () => (
  <Result
    status="success"
    title="Signature Verified!"
    extra={[
      <Button type="primary" key="console">
        Share with organizations
      </Button>,
    ]}
  />
);
export default Verified;