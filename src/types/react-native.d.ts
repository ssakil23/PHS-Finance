// Type declarations for React Native / React Native for Web (Expo Web)
declare module 'react-native' {
  import * as React from 'react';

  export type StyleProp<T> = T | Array<T | undefined | null | false> | undefined;

  export interface ViewStyle {
    flex?: number;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    gap?: number;
    rowGap?: number;
    columnGap?: number;
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    padding?: number | string;
    paddingTop?: number | string;
    paddingRight?: number | string;
    paddingBottom?: number | string;
    paddingLeft?: number | string;
    paddingHorizontal?: number | string;
    paddingVertical?: number | string;
    margin?: number | string;
    marginTop?: number | string;
    marginRight?: number | string;
    marginBottom?: number | string;
    marginLeft?: number | string;
    marginHorizontal?: number | string;
    marginVertical?: number | string;
    position?: 'absolute' | 'relative';
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
    zIndex?: number;
    backgroundColor?: string;
    borderColor?: string;
    borderTopColor?: string;
    borderRightColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRadius?: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    borderWidth?: number;
    borderTopWidth?: number;
    borderRightWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderStyle?: 'solid' | 'dotted' | 'dashed';
    opacity?: number;
    overflow?: 'visible' | 'hidden' | 'scroll';
    elevation?: number;
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    display?: 'none' | 'flex';
    transform?: any[];
    cursor?: string;
    transition?: string;
    userSelect?: 'auto' | 'text' | 'none' | 'contain' | 'all';
    [key: string]: any;
  }

  export interface TextStyle extends ViewStyle {
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    fontStyle?: 'normal' | 'italic';
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    letterSpacing?: number;
    lineHeight?: number;
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
    textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
    textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed';
    textDecorationColor?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  }

  export interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    testID?: string;
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  }

  export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
    style?: StyleProp<TextStyle>;
    children?: React.ReactNode;
    numberOfLines?: number;
    selectable?: boolean;
    testID?: string;
  }

  export interface TouchableOpacityProps extends React.HTMLAttributes<HTMLDivElement> {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    onPress?: (event?: any) => void;
    disabled?: boolean;
    activeOpacity?: number;
    testID?: string;
  }

  export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
    style?: StyleProp<TextStyle>;
    value?: string;
    defaultValue?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
    editable?: boolean;
  }

  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: StyleProp<ViewStyle>;
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
  }

  export const View: React.FC<ViewProps>;
  export const Text: React.FC<TextProps>;
  export const TouchableOpacity: React.FC<TouchableOpacityProps>;
  export const TextInput: React.FC<TextInputProps>;
  export const ScrollView: React.FC<ScrollViewProps>;
  export const Pressable: React.FC<TouchableOpacityProps>;
  export const ActivityIndicator: React.FC<any>;

  export namespace StyleSheet {
    export function create<T extends Record<string, ViewStyle | TextStyle>>(styles: T): T;
  }

  export const Platform: {
    OS: 'web' | 'ios' | 'android';
    select: <T>(specifics: { web?: T; ios?: T; android?: T; default?: T }) => T;
  };
}
