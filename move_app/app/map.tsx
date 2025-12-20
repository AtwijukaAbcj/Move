import { View, Text } from "react-native";
import React from "react";
import Container from "@/components/Container";
import tw from "twrnc";
import MapContent from "@/components/MapContent";
import NavigateCard from "@/components/NavigateCard";

const MapScreen = () => {
  return (
    <Container className="p-0">
      <View style={tw`h-1/2`}>
        <MapContent />
      </View>
      <View style={tw`h-1/2`}>
        <NavigateCard />
      </View>
    </Container>
  );
};

export default MapScreen;
