import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      'Recent CVEs Affecting Network Infrastructure': 'Recent CVEs Affecting Network Infrastructure',
      'Live Threat Intelligence Feeds': 'Live Threat Intelligence Feeds'
    }
  },
  ms: {
    translation: {
      'Recent CVEs Affecting Network Infrastructure': 'CVE Terkini yang Mempengaruhi Infrastruktur Rangkaian',
      'Live Threat Intelligence Feeds': 'Sumber Intelijen Ancaman Masa Nyata'
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export default i18n
