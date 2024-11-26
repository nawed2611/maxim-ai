import express from 'express'
const app = express()
const port = 3000
import jobRoutes from './routes/job.route.js'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/api/jobs', jobRoutes)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})