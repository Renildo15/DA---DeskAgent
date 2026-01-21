import { nameClassStyles } from "@/utils/class_names";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export type LogType = {
  level: string;
  message: string;
  timestamp: number;
};

export type allActionsType = {
  id: string;
  command: string;
  nameClass: keyof typeof nameClassStyles;
  iconName:
    | keyof typeof MaterialCommunityIcons.glyphMap
    | keyof typeof MaterialIcons.glyphMap
    | keyof typeof FontAwesome6.glyphMap;
  text: string;
  disabledWhenOffline: boolean;
  customAction?: () => void;
};
