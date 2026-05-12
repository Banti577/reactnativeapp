import React, { useState } from 'react';

import {
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomTextField from '../../components/CustomTextField';
import CustomButton from '../../components/CustomButton';
import Logo from '../../components/CustomLogo'
import Checkbox from '../../components/Checkbox';

const TEAL = '#2DC5A2';
const TEAL_LOGIN_TEXT = '#0dbfbc'
const BLUE = '#3A6FD8';
const BG = '#EAEAEA';
const WHITE = '#FFFFFF';
const MUTED = '#888888';

const TEXTFIELD_BG = '#d1dfe4e5'
const TEXTFIELD_Color = 'black'

const TITLE_TEXT = '#6c6767'

// ───────────────── SCREEN ─────────────────

export default function RecruiterLoginScreen() {

  const [email, setEmail] = useState('lionel@interviewnow.io');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleLogin = () => console.log('Login');
  const handleSignUp = () => console.log('Signup');
  const handleForgotPassword = () => console.log('Forgot Password');


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* LOGO – exact paths from interviewnow-logo.svg */}
          <Logo

            width={300}
            height={70}
          />

          {/* TITLE */}
          <Text style={styles.title}>Recruiter Login</Text>

          {/* EMAIL – backgroundColor={BG} so it blends with the grey screen */}
          <CustomTextField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            backgroundColor={TEXTFIELD_BG}
            textColor={TEXTFIELD_Color}
          />

          {/* PASSWORD – same bg fix */}
          <CustomTextField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            backgroundColor={TEXTFIELD_BG}
            textColor={TEXTFIELD_Color}

          />

          {/* REMEMBER ME */}
          <Checkbox
            checked={remember}
            onToggle={() => setRemember(v => !v)}
          />

          {/* LOG IN */}
          <CustomButton
            title="Log in"
            bgColor={TEAL_LOGIN_TEXT}
            onPress={handleLogin}
          />

          {/* DON'T HAVE AN ACCOUNT? */}
          <Text style={styles.noAccount}>Don't have an account?</Text>

          {/* SIGN UP */}
          <CustomButton
            title="Sign up"
            bgColor={TEAL}
            onPress={handleSignUp}

          />

          {/* FORGOT PASSWORD */}
          <View style={{ marginTop: 10 }}>
            <CustomButton

              title="Forgot your password?"
              bgColor={BLUE}
              onPress={handleForgotPassword}

            />
          </View>

          {/* FOOTER */}
          <Text style={styles.footer}>Interview Now © 2026</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


// ───────────────── STYLES ─────────────────

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  flex: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    //justifyContent:'center'
    paddingTop: 50,
  },

  // TITLE

  title: {
    fontSize: 21,
    fontWeight: '700',
    color: TITLE_TEXT,
    marginBottom: 18,
    textAlign: 'center',
  },

  // "DON'T HAVE AN ACCOUNT?"

  noAccount: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
  },

  // FOOTER

  footer: {
    marginTop: 30,
    textAlign: 'center',
    color: MUTED,
    fontSize: 12,
    fontWeight: 800
  },
});