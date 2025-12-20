import { Text } from "react-native";
import React from "react";
import tw from "twrnc";

interface Props {
  children: React.ReactNode;
  className?: string;
}

const Title = ({ children, className }: Props) => {
  return (
    <Text
      style={[tw`text-5xl font-semibold`, className ? tw`${className}` : null]}
    >
      {children}
    </Text>
  );
};

export default Title;
