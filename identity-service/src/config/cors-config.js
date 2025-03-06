const cors = require('cors')

const configureCors = ()=>{
    return cors ({
        origin : (origin, callback)=>{
            const allowedOrigin = [
                'http://localhost:3000',
            ]
            if(!origin || allowedOrigin.indexOf(origin) !== -1){
                callback(null, true)
            }else{
                callback(new Error('Not allowed by cors'))
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: [
            'Content-Type',
            'Aythorization',
            'Accept-Version'
        ],
        exposedHeaders: ['X-Total-Count', 'Content-Ranged'],
        credentials: true,
        preflightContinue: false,
        maxAge: 600,
        optionsSuccessStatus: 204
    })
}

module.exports = configureCors