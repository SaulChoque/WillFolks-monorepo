declare module '@mustapha-ghlissi/react-native-accordion' {
  import { ReactNode } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  export interface AccordionProps {
    children: ReactNode;
    containerStyle?: ViewStyle;
    animationDuration?: number;
    compact?: boolean;
    titleStyle?: TextStyle;
    subTitleStyle?: TextStyle;
    titleContainerStyle?: ViewStyle;
    headerStyle?: ViewStyle;
    itemContainerStyle?: ViewStyle;
    contentContainerStyle?: ViewStyle;
    contentWrapperStyle?: ViewStyle;
  }

  export interface AccordionItemProps {
  title: string | ReactNode;
  subTitle?: string | ReactNode;
    header?: ReactNode;
    rightIcon?: string | ReactNode;
    leftIcon?: string | ReactNode;
    children: ReactNode;
    titleStyle?: TextStyle;
    subTitleStyle?: TextStyle;
    titleContainerStyle?: ViewStyle;
    headerStyle?: ViewStyle;
    itemContainerStyle?: ViewStyle;
    contentContainerStyle?: ViewStyle;
    contentWrapperStyle?: ViewStyle;
  }

  export const Accordion: React.FC<AccordionProps>;
  export const AccordionItem: React.FC<AccordionItemProps>;
}
