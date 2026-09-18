import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import type { LinkEmailResult } from '../auth/authService';
import { MIN_PASSWORD_LENGTH } from '../auth/authService';
import PressableScale from './PressableScale';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

export interface EmailLinkFormProps {
  onSubmit: (email: string, password: string) => Promise<LinkEmailResult>;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** T49 (form) + T54 (server-error banner) / US-11 AC2/AC4. */
export default function EmailLinkForm({ onSubmit, onSuccess, onCancel }: EmailLinkFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  function validateClientSide(): boolean {
    let valid = true;
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
      valid = false;
    } else {
      setEmailError(null);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
      valid = false;
    } else {
      setPasswordError(null);
    }
    return valid;
  }

  async function handleSubmit() {
    setServerError(null);
    if (!validateClientSide()) return;
    setSubmitting(true);
    try {
      const result = await onSubmit(email.trim(), password);
      if (result.ok) {
        onSuccess();
      } else {
        setServerError(result.message ?? 'เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {serverError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{serverError}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>อีเมล</Text>
      <TextInput
        style={[styles.input, focusedField === 'email' && styles.inputFocused]}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        onFocus={() => setFocusedField('email')}
        onBlur={() => setFocusedField(null)}
      />
      {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

      <Text style={styles.label}>รหัสผ่าน</Text>
      <TextInput
        style={[styles.input, focusedField === 'password' && styles.inputFocused]}
        placeholder="อย่างน้อย 6 ตัวอักษร"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onFocus={() => setFocusedField('password')}
        onBlur={() => setFocusedField(null)}
      />
      {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

      <PressableScale
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>ผูกอีเมล</Text>}
      </PressableScale>
      <PressableScale style={styles.cancelButton} onPress={onCancel} disabled={submitting}>
        <Text style={styles.cancelButtonText}>ยกเลิก</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, gap: 4, backgroundColor: COLORS.background, borderRadius: RADIUS.lg, ...SHADOWS.sm },
  errorBanner: {
    backgroundColor: '#FBEAEA',
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  errorBannerText: { color: COLORS.danger, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.sm, marginBottom: SPACING.xxs + 2 },
  input: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    fontSize: 15,
    minHeight: 44,
  },
  inputFocused: { borderColor: COLORS.accent, borderWidth: 2 },
  fieldError: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  submitButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  cancelButton: { marginTop: SPACING.sm, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xs, minHeight: 44 },
  cancelButtonText: { color: COLORS.textSecondary, fontSize: 14 },
});
