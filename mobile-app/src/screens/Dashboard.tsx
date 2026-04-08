import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { List, Card, Badge, IconButton, Text, Searchbar } from 'react-native-paper';
import { getFunctions, httpsCallable } from 'firebase/functions';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    const functions = getFunctions();
    const manageUser = httpsCallable(functions, 'manageUser');
    const result = await manageUser({ action: 'list' });
    setUsers(result.data);
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <View style={styles.container}>
      <Searchbar placeholder="Search Locas Users" value={search} onChangeText={setSearch} />
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <List.Item
              title={item.email}
              description={`UID: ${item.uid}`}
              left={props => <List.Icon {...props} icon="account" />}
              right={() => (
                <View style={styles.statusRow}>
                  {item.disabled ? 
                    <Badge style={{backgroundColor: 'red'}}>Blocked</Badge> : 
                    <Badge style={{backgroundColor: 'green'}}>Active</Badge>
                  }
                  <IconButton icon="dots-vertical" onPress={() => {/* Open Action Menu */}} />
                </View>
              )}
            />
            {/* Expanded section for Password/Devices/Plans */}
            <View style={styles.detailBar}>
               <Text variant="labelSmall">Plan: Yearly</Text>
               <Text variant="labelSmall">Devices: 3/5</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
  card: { marginVertical: 5, borderRadius: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  detailBar: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10 }
});

export default Dashboard;
