import { useRouter } from 'next/router';
let jwt = require('jsonwebtoken');


export default function auth( user ) {
    try {
        var decoded = jwt.verify(user, 'secret123');
    } catch (err) {
        return null;
    }
    return decoded;
}