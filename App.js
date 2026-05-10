import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './app/screens/SplashScreen';
import LoginScreen from './app/screens/LoginScreen';
import StudentDashboard from './app/screens/StudentDashboard';
import FacultyDashboard from './app/screens/FacultyDashboard';
import ReadModuleScreen from './app/screens/StudyTopicsScreen';
import ARViewerScreen from './app/screens/ARViewerScreen';
import ChatbotScreen from './app/screens/ChatbotScreen';
import QuizScreen from './app/screens/QuizScreen';
import ResultsScreen from './app/screens/ResultsScreen';
import QuizAttemptScreen from './app/screens/QuizAttemptScreen';
import ClassReportsScreen from './app/screens/ClassReportsScreen';
import StudentDetailScreen from './app/screens/StudentDetailScreen';
import QuizDetailScreen from './app/screens/QuizDetailScreen';
import AttemptDetailScreen from './app/screens/AttemptDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="FacultyDashboard" component={FacultyDashboard} />
        <Stack.Screen name="ReadModule" component={ReadModuleScreen} />
        <Stack.Screen name="ARViewer" component={ARViewerScreen} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="QuizAttempt" component={QuizAttemptScreen} />
        <Stack.Screen name="ClassReports" component={ClassReportsScreen} />
        <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
        <Stack.Screen name="QuizDetail" component={QuizDetailScreen} />
        <Stack.Screen name="AttemptDetail" component={AttemptDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
