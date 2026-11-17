import { lazy } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { isTableQrLink, sitePages, useSite } from '@bookingsystemadvancedorg/site-kit'
import { CustomerLayout } from './shared/CustomerLayout'
import MenyPage from './features/meny/MenyPage'
import KontaktPage from './features/kontakt/KontaktPage'
import OmOssPage from './features/om/OmOssPage'

// Flödena hämtas först när gästen öppnar dem (menyn, startsidan, är med från
// början); CustomerLayout visar ett skelett under tiden.
const BookingFlow = lazy(sitePages.booking)
const ManageBooking = lazy(sitePages.manageBooking)
const OrderFlow = lazy(sitePages.order)
const Kassan = lazy(sitePages.kassan)
const OrderStatus = lazy(sitePages.orderStatus)
const CateringFlow = lazy(sitePages.catering)
const CateringRequest = lazy(sitePages.cateringRequest)
const PrivacyPolicy = lazy(sitePages.privacy)
const CookiePolicy = lazy(sitePages.cookies)
const BookingTermsPage = lazy(sitePages.bookingTerms)
const GiftCards = lazy(sitePages.presentkort)
const GiftCardBalance = lazy(sitePages.presentkortSaldo)
const Queue = lazy(sitePages.ko)
const Events = lazy(sitePages.evenemang)
const EventDetail = lazy(sitePages.evenemangDetalj)
const Tickets = lazy(sitePages.biljett)
const TicketReceive = lazy(sitePages.biljettTaEmot)

/**
 * Restaurangens publika webbplats - samma sajt för alla restauranger, med
 * innehållet från GET /site-config. Flödena (boka, beställ, catering,
 * presentkort, kö, evenemang, juridik) kommer från
 * @bookingsystemadvancedorg/site-kit; den här appen är layouten, sidorna och
 * looken. Menyn är startsida; okända sökvägar skickas dit. Varje flöde finns
 * bara med funktionen i planen (kö dessutom bara när platsen tar emot kö på
 * sajten). En gammal QR-kod från ett bord (/bestall?bord=...) visar alltid
 * "Beställ och betala i kassan". Gästens sidor för en gjord
 * bokning/beställning/cateringförfrågan (länkar i sms och mejl) finns alltid.
 */
function App() {
  const { config, location } = useSite()
  const reservations = config.tenant.features.reservations
  const ordering = config.tenant.features.ordering
  const catering = config.tenant.features.catering
  const giftCards = config.tenant.features.giftCards
  const queue = config.tenant.features.waitlist && location.waitlist?.publicJoin
  const events = config.tenant.features.events
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<MenyPage />} />
        <Route path="meny" element={<MenyPage />} />
        {reservations && <Route path="boka-bord" element={<BookingFlow />} />}
        {reservations && <Route path="bokningsvillkor" element={<BookingTermsPage />} />}
        <Route path="bokning/:locationId/:reservationId" element={<ManageBooking />} />
        <Route path="bestall" element={<Bestall order={ordering ? <OrderFlow /> : null} kassan={<Kassan />} />} />
        <Route path="bestallning/:locationId/:orderId" element={<OrderStatus />} />
        {catering && <Route path="catering" element={<CateringFlow />} />}
        <Route path="catering/:locationId/:requestId" element={<CateringRequest />} />
        {giftCards && <Route path="presentkort" element={<GiftCards />} />}
        {giftCards && <Route path="presentkort/saldo" element={<GiftCardBalance />} />}
        {queue && <Route path="ko" element={<Queue />} />}
        {events && <Route path="evenemang" element={<Events />} />}
        {events && <Route path="evenemang/:eventId" element={<EventDetail />} />}
        {events && <Route path="biljett" element={<Tickets />} />}
        {events && <Route path="biljett/ta-emot" element={<TicketReceive />} />}
        <Route path="om-oss" element={<OmOssPage />} />
        <Route path="kontakt" element={<KontaktPage />} />
        <Route path="integritetspolicy" element={<PrivacyPolicy />} />
        <Route path="cookies" element={<CookiePolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

/** /bestall: en gammal QR-kod från ett bord leder till kassan; annars avhämtning (med beställning i planen). */
function Bestall({ order, kassan }: { order: ReactNode; kassan: ReactNode }) {
  const { search } = useLocation()
  if (isTableQrLink(search)) return kassan
  return order ?? <Navigate to="/" replace />
}

export default App
