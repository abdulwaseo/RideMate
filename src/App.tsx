import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/WebSocketContext';
import { ChatProvider } from './contexts/ChatContext';
import { TrackingProvider } from './contexts/TrackingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RideProvider } from './contexts/RideContext';
import { CommunicationProvider } from './contexts/CommunicationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { NetworkStatusBanner } from './components/websocket/NetworkStatusBanner';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <ChatProvider>
                <TrackingProvider>
                  <NotificationProvider>
                    <NetworkStatusBanner />
                    <RideProvider>
                      <CommunicationProvider>
                        <AppRoutes />
                      </CommunicationProvider>
                    </RideProvider>
                  </NotificationProvider>
                </TrackingProvider>
              </ChatProvider>
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
