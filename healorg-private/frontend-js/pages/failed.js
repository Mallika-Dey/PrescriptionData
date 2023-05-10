import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Result, Typography } from 'antd';
const { Paragraph, Text } = Typography;
const Failed = () => (
  <Result
    status="error"
    title="Signature Verification Failed"
    subTitle="Please check the txid and certificate before resubmitting."
  >
    
  </Result>
);
export default Failed;