declare module "@mailchimp/mailchimp_transactional" {
  interface MandrillMessagesSendBody {
    message: {
      from_email: string
      subject: string
      html?: string
      text?: string
      to: Array<{ email: string; type: string }>
    }
    async?: boolean
  }

  interface MandrillClient {
    messages: {
      send(body: MandrillMessagesSendBody): Promise<unknown>
    }
  }

  function mailchimp(apiKey: string): MandrillClient
  export default mailchimp
}
