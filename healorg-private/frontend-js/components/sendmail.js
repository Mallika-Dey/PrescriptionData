import React from 'react';
import emailjs from '@emailjs/browser';


export default function sendEmail (e) {
     // prevents the page from reloading when you hit “Send”
    emailjs.sendForm('service_pjs8bif', 'template_pv3t6ej', e.target, 'jqVPcEbU8vUhh6h1a')
        .then((result) => {
            // show the user a success message
            console.log("success");
        }, (error) => {
            console.log(error);
        });
};