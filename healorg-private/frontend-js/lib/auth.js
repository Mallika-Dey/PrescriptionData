import { useRouter } from 'next/router';
let jwt = require('jsonwebtoken');


export default function auth({ user }) {
    try {
        var decoded = jwt.verify(user.value, 'secret123');
    } catch (err) {
        return null;
    }
    return decoded;
}