# 🏛️ Mandap Association User Mobile App

A React Native mobile application for users to connect with Mandap Associations, browse members, view events, and stay updated with community news.

## 🎯 Features

### 🔐 Authentication
- **Mobile OTP Login**: Secure login using mobile number and OTP verification
- **User Registration**: Simple registration process for new users
- **Profile Management**: Edit personal information and upload profile images

### 🔍 Member Discovery
- **Advanced Search**: Search members by name, district, category, or association
- **Filter Options**: Multiple filter criteria for refined results
- **Member Profiles**: View detailed member information with contact options
- **Quick Actions**: Call or WhatsApp members directly from the app

### 📅 Events & Activities
- **Event Browsing**: View upcoming and past community events
- **Event Registration**: Register/unregister for events
- **Event Details**: Comprehensive event information with images and descriptions
- **Event Categories**: Organized by type (meetings, expos, celebrations, workshops)

### 🔔 Notifications
- **Push Notifications**: Stay updated with important alerts
- **Categorized Alerts**: Events, Member Updates, Celebrations, News
- **Read/Unread Status**: Track notification status

### 👥 Community Directory
- **BOD Directory**: View Board of Directors members
- **NBOD Directory**: National Board of Directors listing
- **Association Information**: Browse association details and member counts

### 🌐 Multilingual Support
- **Multiple Languages**: English, Marathi (मराठी), Hindi (हिंदी)
- **Dynamic Switching**: Change language on the fly

## 🛠️ Technical Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Tab Navigation)
- **State Management**: React Hooks (useState, useEffect)
- **UI Components**: Custom components with React Native
- **Icons**: Expo Vector Icons (Ionicons)
- **HTTP Client**: Axios for API communication
- **Image Handling**: Expo Image Picker

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
│   ├── LoginScreen     # Authentication screen
│   ├── HomeScreen      # Main dashboard
│   ├── MembersScreen   # Member search and discovery
│   ├── EventsScreen    # Events browsing
│   ├── NotificationsScreen # Notifications center
│   └── ProfileScreen   # User profile management
├── navigation/         # Navigation configuration
├── services/           # API services
├── types/              # TypeScript type definitions
├── constants/          # App constants and configuration
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MandapUserApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/emulator**
   ```bash
   # Android
   npm run android
   
   # iOS (macOS only)
   npm run ios
   
   # Web
   npm run web
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
API_BASE_URL=http://localhost:5000/api
```

### API Configuration
Update `src/constants/index.ts` with your backend API URL:
```typescript
export const API_BASE_URL = 'your-backend-url/api';
```

## 📱 Screen Navigation

### Authentication Flow
- **Login** → **OTP Verification** → **Main App**

### Main App Navigation
- **Home Tab**: Dashboard with quick actions and recent updates
- **Members Tab**: Search and browse community members
- **Events Tab**: View and register for community events
- **Notifications Tab**: Stay updated with alerts and news
- **Profile Tab**: Manage personal information and settings

## 🎨 UI/UX Features

- **Modern Design**: Clean, intuitive interface with Material Design principles
- **Responsive Layout**: Optimized for various screen sizes
- **Dark/Light Theme**: Consistent color scheme throughout the app
- **Smooth Animations**: Enhanced user experience with transitions
- **Accessibility**: Support for screen readers and accessibility features

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **OTP Verification**: Two-factor authentication for mobile login
- **Secure API Calls**: HTTPS communication with backend
- **Data Validation**: Input validation and sanitization

## 📊 Performance Optimizations

- **Lazy Loading**: Load screens and components on demand
- **Image Optimization**: Efficient image handling and caching
- **API Caching**: Smart caching strategies for better performance
- **Memory Management**: Optimized component lifecycle management

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 📦 Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

## 🚀 Deployment

### Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build and submit
eas build --platform android
eas build --platform ios
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **Real-time Chat**: In-app messaging between members
- **Push Notifications**: Enhanced notification system
- **Offline Support**: Work without internet connection
- **Social Features**: Like, comment, and share functionality
- **Analytics Dashboard**: User engagement metrics
- **Payment Integration**: Event registration payments
- **Advanced Search**: AI-powered member recommendations

---

**Built with ❤️ for the Mandap Association Community**


