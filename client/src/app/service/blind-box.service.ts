import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import {
  BlindBoxRarity,
  BlindBoxItem,
  BlindBoxKey,
  BlindBoxCollection,
  UserKeyInventory,
  PokedexCard,
  UnboxResult,
  CollectionProgress
} from '../model/blind-box.model';

@Injectable({ providedIn: 'root' })
export class BlindBoxService {
  private http = inject(HttpClient);
  private userApi = `${environment.apiUrl}blind-boxes`;
  private adminApi = `${environment.apiUrl}admin/blind-boxes`;

  // --- USER API ---
  getMyKeys(): Observable<UserKeyInventory[]> {
    return this.http.get<UserKeyInventory[]>(`${this.userApi}/my-keys`);
  }

  getCollections(): Observable<CollectionProgress[]> {
    return this.http.get<CollectionProgress[]>(`${this.userApi}/collections`);
  }

  getPokedex(collectionId: number, targetUserId?: number): Observable<PokedexCard[]> {
    let url = `${this.userApi}/collections/${collectionId}/pokedex`;
    if (targetUserId) url += `?userId=${targetUserId}`;
    return this.http.get<PokedexCard[]>(url);
  }

  openBox(boxId: number): Observable<UnboxResult> {
    return this.http.post<UnboxResult>(`${this.userApi}/open/${boxId}`, {});
  }

  isInspectionEnabled(): Observable<boolean> {
    return this.http.get<boolean>(`${this.userApi}/inspection-enabled`);
  }

  // --- ADMIN API ---
  getRarities(): Observable<BlindBoxRarity[]> {
    return this.http.get<BlindBoxRarity[]>(`${this.adminApi}/rarities`);
  }

  saveRarity(rarity: BlindBoxRarity): Observable<BlindBoxRarity> {
    return this.http.post<BlindBoxRarity>(`${this.adminApi}/rarities`, rarity);
  }

  deleteRarity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApi}/rarities/${id}`);
  }

  getAdminCollections(): Observable<BlindBoxCollection[]> {
    return this.http.get<BlindBoxCollection[]>(`${this.adminApi}/collections`);
  }

  saveCollection(collection: BlindBoxCollection): Observable<BlindBoxCollection> {
    return this.http.post<BlindBoxCollection>(`${this.adminApi}/collections`, collection);
  }

  deleteCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApi}/collections/${id}`);
  }

  saveItem(item: BlindBoxItem): Observable<BlindBoxItem> {
    return this.http.post<BlindBoxItem>(`${this.adminApi}/items`, item);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApi}/items/${id}`);
  }

  getKeys(): Observable<BlindBoxKey[]> {
    return this.http.get<BlindBoxKey[]>(`${this.adminApi}/keys`);
  }

  saveKey(key: BlindBoxKey): Observable<BlindBoxKey> {
    return this.http.post<BlindBoxKey>(`${this.adminApi}/keys`, key);
  }

  grantKey(userId: number, keyId: number, quantity: number): Observable<void> {
    return this.http.post<void>(`${this.adminApi}/grant-key?userId=${userId}&keyId=${keyId}&quantity=${quantity}`, {});
  }

  toggleInspection(enabled: boolean): Observable<void> {
    return this.http.put<void>(`${this.adminApi}/settings/inspection?enabled=${enabled}`, {});
  }
}