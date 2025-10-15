import { setGlobalOptions } from 'firebase-functions/v2'
import { onRequest } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import admin from 'firebase-admin'
import corsLib from 'cors'
import { defineSecret } from 'firebase-functions/params'
import sgMail from '@sendgrid/mail'
import { getStorage } from 'firebase-admin/storage'

setGlobalOptions({ region: 'australia-southeast1', timeoutSeconds: 60, memory: '256MiB' })
const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')
const SENDGRID_TEMPLATE_ID = 'd-4332e1e212764dc0a452f17104cbc9eb'

if (!admin.apps.length) admin.initializeApp()

// Allow requests only from your frontend
const cors = corsLib({ origin: true })

export const sendWelcomeEmail = onRequest({ secrets: [SENDGRID_API_KEY] }, async (req, res) => {
  // Use CORS to check if the request domain is allowed
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

      // 1) Verify Firebase ID token
      const authHeader = req.headers.authorization || ''
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
      if (!idToken) return res.status(401).json({ error: 'Missing Authorization header' })

      const decoded = await admin.auth().verifyIdToken(idToken) // verify fail will throw
      logger.info('Auth OK', { uid: decoded.uid })

      // 2) Read data sent from the frontend
      const { to, displayName } = req.body || {}
      if (!to) return res.status(400).json({ error: "Missing 'to' field" })

      logger.info('Receive request', { to, displayName })

      // read Cloud Storage attachment
      const [buf] = await getStorage().bucket().file('emails/welcome.pdf').download()
      const attachmentBase64 = buf.toString('base64')

      // set SendGrid key

      const key = SENDGRID_API_KEY.value()
      if (!key || !key.startsWith('SG.')) {
        logger.error(
          '❌ Invalid SENDGRID_API_KEY format:',
          key ? key.slice(0, 5) + '...' : 'undefined',
        )
        throw new Error('SENDGRID_API_KEY is invalid — should start with SG.')
      }

      sgMail.setApiKey(key)
      logger.info('✅ SENDGRID_API_KEY loaded successfully.')

      // send email (Dynamic Template + attachment)
      await sgMail.send({
        to,
        from: { email: 'evelyntsai0917@gmail.com', name: 'Myhealth Team' },
        templateId: SENDGRID_TEMPLATE_ID,
        dynamicTemplateData: { displayName },
        attachments: [
          {
            filename: 'welcome.pdf',
            type: 'application/pdf',
            content: attachmentBase64,
            disposition: 'attachment',
          },
        ],
      })

      // 3) Send back success message
      return res.status(200).json({ ok: true })
    } catch (e) {
      logger.error('sendWelcomeEmail error', e)
      return res.status(500).json({ error: 'Internal error' })
    }
  })
})
