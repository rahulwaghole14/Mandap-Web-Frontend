import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const EventSEO = ({ event, isPostponed = false, originalDate = null }) => {
  useEffect(() => {
    // Update document title for better SEO
    if (event) {
      const eventName = event.name || event.title || 'Event';
      const eventCity = event.city || '';
      const eventDate = event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      }) : '';
      
      document.title = `${eventName} | ${eventDate} | ${eventCity} | Mandapam Association`;
    }
  }, [event]);

  // Generate structured data for SEO
  const generateStructuredData = () => {
    if (!event) return {};

    const eventName = event.name || event.title || 'Event';
    const eventDescription = event.description || '';
    const startDate = event.startDate || event.startDateTime;
    const endDate = event.endDate || event.endDateTime;
    const eventAddress = event.address || '';
    const eventCity = event.city || '';
    const eventState = event.state || '';
    const eventPincode = event.pincode || '';
    const eventImage = event.image || event.imageURL;

    // Format dates for schema.org
    const formatSchemaDate = (dateString, timeString = null) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (timeString) {
        const [hours, minutes] = timeString.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
      }
      return date.toISOString();
    };

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": eventName,
      "description": isPostponed 
        ? `Event postponed from ${originalDate ? new Date(originalDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : 'original date'}. ${eventDescription}` 
        : eventDescription,
      "startDate": formatSchemaDate(startDate, event.startTime),
      "endDate": formatSchemaDate(endDate || startDate, event.endTime),
      "eventStatus": isPostponed 
        ? "https://schema.org/EventRescheduled" 
        : "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": eventAddress || `${eventCity}, ${eventState}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": eventAddress,
          "addressLocality": eventCity,
          "addressRegion": eventState,
          "postalCode": eventPincode,
          "addressCountry": "IN"
        }
      },
      "organizer": {
        "@type": "Organization",
        "name": "Mandapam Association",
        "url": window.location.origin,
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/mandapam-logo.png`,
          "width": 128,
          "height": 128
        }
      }
    };

    // Add image if available
    if (eventImage) {
      const imageUrl = typeof eventImage === 'string' 
        ? eventImage 
        : `${window.location.origin}/uploads/${eventImage}`;
      structuredData.image = imageUrl;
    }

    return structuredData;
  };

  const structuredData = generateStructuredData();

  // Generate meta description
  const generateMetaDescription = () => {
    if (!event) return '';
    
    const eventName = event.name || event.title || 'Event';
    const eventCity = event.city || '';
    const eventDate = event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    }) : '';
    
    if (isPostponed) {
      return `${eventName} scheduled in ${eventDate}. Previously planned for ${originalDate ? new Date(originalDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      }) : 'earlier date'}, now rescheduled. Register now for this event in ${eventCity}.`;
    }
    
    return `${eventName} happening on ${eventDate} in ${eventCity}. Register now for this exciting event organized by Mandapam Association.`;
  };

  return (
    <Helmet>
      {/* Favicon and app icons */}
      <link rel="icon" type="image/png" href="/mandapam-logo.png" />
      <link rel="apple-touch-icon" href="/mandapam-logo.png" />
      <link rel="shortcut icon" href="/mandapam-logo.png" />
      
      {/* Meta tags */}
      <meta name="description" content={generateMetaDescription()} />
      <meta name="keywords" content={`${event?.name || event?.title}, event, ${event?.city}, mandapam association, ${event?.type}`} />
      
      {/* Open Graph tags for social sharing */}
      <meta property="og:title" content={`${event?.name || event?.title} | ${event?.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : ''} | ${event?.city}`} />
      <meta property="og:description" content={generateMetaDescription()} />
      <meta property="og:type" content="event" />
      <meta property="og:url" content={window.location.href} />
      <meta property="og:site_name" content="Mandapam Association" />
      <meta property="og:image" content={`${window.location.origin}/mandapam-logo.png`} />
      <meta property="og:image:width" content="128" />
      <meta property="og:image:height" content="128" />
      <meta property="og:image:type" content="image/png" />
      
      {event?.image && (
        <meta property="og:image" content={typeof event.image === 'string' ? event.image : `${window.location.origin}/uploads/${event.image}`} />
      )}
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${event?.name || event?.title} | ${event?.city}`} />
      <meta name="twitter:description" content={generateMetaDescription()} />
      <meta name="twitter:image" content={`${window.location.origin}/mandapam-logo.png`} />
      <meta name="twitter:site" content="@MandapamAssociation" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={window.location.href} />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default EventSEO;
