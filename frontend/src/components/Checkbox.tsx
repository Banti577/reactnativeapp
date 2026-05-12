import React from 'react';
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
} from 'react-native';

const TEAL = '#2DC5A2';
const WHITE = '#FFFFFF';
const TEXT = '#1A1A1A';

type Props = {
    checked: boolean;
    onToggle: () => void;
    label?: string;
};

export default function Checkbox({
    checked,
    onToggle,
    label = 'Remember me',
}: Props) {
    return (
        <TouchableOpacity
            onPress={onToggle}
            style={styles.checkboxHit}
            activeOpacity={0.7}
        >
            <View
                style={[
                    styles.checkboxBox,
                    checked && styles.checkboxChecked,
                ]}
            >
                {checked && (
                    <Text style={styles.checkmark}>
                        ✓
                    </Text>
                )}
            </View>

            <Text style={styles.checkboxLabel}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // CHECKBOX

    checkboxHit: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },

    checkboxBox: {
        width: 18,
        height: 18,
        borderWidth: 1.5,
        borderColor: '#999',
        borderRadius: 3,
        backgroundColor: WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    checkboxChecked: {
        backgroundColor: TEAL,
        borderColor: TEAL,
    },

    checkmark: {
        color: WHITE,
        fontSize: 11,
        fontWeight: '700',
    },

    checkboxLabel: {
        fontSize: 15,
        color: TEXT,
        fontWeight: 400
    },

});