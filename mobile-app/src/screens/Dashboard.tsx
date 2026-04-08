import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Searchbar, List, Badge, Divider, ActivityIndicator, Text } from 'react-native-paper';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const manageUser = httpsCallable(functions, 'manageUser');
      const result = await manageUser({ action: 'list' });
      setUsers(result.data as any[]);
      setFilteredUsers(result.data as any[]);
    } catch (e) {
      Alert.alert("Access Denied", "Only the admin account can view this data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onSearch = (query: string) => {
    setSearch(query);
    const filtered = users.filter(u => u.email.toLowerCase().includes(query.toLowerCase()));
    setFilteredUsers(filtered);
  };

  return (
    <View style={styles.container}>
      <Searchbar placeholder="Search Users" onChangeText={onSearch} value={search} style={styles.search} />
      {loading ? <ActivityIndicator animating={true} style={{marginTop: 50}} /> : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.uid}
          ItemSeparatorComponent={Divider}
          renderItem={({ item }) => (
            <List.Item
              title={item.email}
              description={`Pass: ${item.password} | Plan: ${item.customClaims?.plan || 'trial'}`}
              left={props => <List.Icon {...props} icon="account" />}
              right={() => (
                <View style={styles.statusBox}>
                  <Text style={styles.deviceCount}>📱 {item.deviceCount}/5</Text>
                  <Badge style={{ backgroundColor: item.disabled ? 'red' : 'green' }}>
                    {item.disabled ? 'OFF' : 'ON'}
                  </Badge>
                </View>
              )}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  search: { margin: 10, borderRadius: 8 },
  statusBox: { flexDirection: 'row', alignItems: 'center' },
  deviceCount: { fontSize: 12, marginRight: 10, color: '#666' }
});
