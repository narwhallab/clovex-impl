import 'reflect-metadata'
import 'dotenv/config'
import mufin from '@narwhallab/mufin'
import { ClovaExtension, IntentHandler, IntentListener, ClovaResponse, handleClova } from '@narwhallab/clovex'
import express from 'express'
import bodyParser from 'body-parser'
import https from 'https'
import fs from 'fs'

const PORT = parseInt(process.env.PORT || "8080")

const app = express()
app.use(bodyParser.json())

mufin.initLogger()
mufin.scanBluetooth().then(() => {
    mufin.connectBluetooth("50:33:8B:2A:8D:3C").then(() => {
        // mufin.bluetoothRead("50:33:8B:2A:8D:3C")
    })
})

class MyIntentListener extends IntentListener {
    @IntentHandler("LedService")
    onLedOn(_intentName: string, slots: any, response: ClovaResponse) {
        if (slots["action"].value == "true") {
            response.addSpeach("불이 켜졌습니다")
            mufin.writeBluetooth("50:33:8B:2A:8D:3C", "on")
        } else {
            response.addSpeach("불이 꺼졌습니다")
            mufin.writeBluetooth("50:33:8B:2A:8D:3C", "off")
        }
        response.continueSession({})
    }
}

ClovaExtension.version = "1.0.0"
ClovaExtension.addListener(new MyIntentListener())

ClovaExtension.onExtensionFire(response => {
    response.speak("무엇을 도와드릴까요?")
    response.continueSession({})
})

ClovaExtension.onSessionEnd(response => {
    response.speak('다음에 또 만나요')
    response.endSession()
})

app.post("/clova", async (req, res) => {
    res.send(handleClova(req.body))
})

https.createServer({
    key: fs.readFileSync(process.env.PRIVATE_KEY || "private_key.pem"),
    cert: fs.readFileSync(process.env.CERTIFICATE || "certificate.pem")
}, app).listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})