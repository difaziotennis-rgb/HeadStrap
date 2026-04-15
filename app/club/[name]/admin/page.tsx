"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2, X, Check, Users, Trophy } from "lucide-react";
import {
  getClub,
  createClub,
  updateClub,
  getPlayersByClubId,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from "@/lib/firebase/db";
import { Club, Player } from "@/lib/types";

export default function ClubAdminPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params?.name as string;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  
  // Club name editing
  const [editingClubName, setEditingClubName] = useState(false);
  const [clubName, setClubName] = useState("");
  const [isSavingClub, setIsSavingClub] = useState(false);
  
  // Add player
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPoints, setNewPlayerPoints] = useState("");
  
  // Edit player
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState("");
  const [editingPlayerPoints, setEditingPlayerPoints] = useState("");
  
  // General state
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const loadClubAndPlayers = async () => {
    if (!clubId) return;
    
    try {
      setLoading(true);
      let clubData = await getClub(clubId);
      
      // Create club if it doesn't exist
      if (!clubData) {
        await createClub({
          name: clubId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          adminId: `admin_${clubId}`,
        }, clubId);
        clubData = await getClub(clubId);
      }
      
      if (clubData) {
        setClub(clubData);
        setClubName(clubData.name);
        const clubPlayers = await getPlayersByClubId(clubData.id);
        setPlayers(clubPlayers);
      }
    } catch (error) {
      console.error("Error loading club:", error);
      setMessage("Error loading club data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clubId) return;
    
    const auth = sessionStorage.getItem(`clubAdmin_${clubId}`);
    if (auth === "true") {
      setIsAuthenticated(true);
      loadClubAndPlayers();
    } else {
      setLoading(false);
      setShowLogin(true);
    }
  }, [clubId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (adminPassword === "admin") {
      sessionStorage.setItem(`clubAdmin_${clubId}`, "true");
      setIsAuthenticated(true);
      setShowLogin(false);
      setAdminPassword("");
      loadClubAndPlayers();
    } else {
      setLoginError("Invalid password");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`clubAdmin_${clubId}`);
    setIsAuthenticated(false);
    setShowLogin(true);
    setClub(null);
    setPlayers([]);
  };

  const handleSaveClubName = async () => {
    if (!club || !clubName.trim()) return;
    
    try {
      setIsSavingClub(true);
      await updateClub(club.id, { name: clubName.trim() });
      setClub({ ...club, name: clubName.trim() });
      setEditingClubName(false);
      setMessage("Club name updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating club name:", error);
      setMessage("Error updating club name");
    } finally {
      setIsSavingClub(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!club || !newPlayerName.trim()) return;
    
    try {
      setIsSaving(true);
      const points = parseInt(newPlayerPoints) || 0;
      await createPlayer({
        name: newPlayerName.trim(),
        points,
        clubId: club.id,
      });
      setNewPlayerName("");
      setNewPlayerPoints("");
      setShowAddPlayer(false);
      await loadClubAndPlayers();
      setMessage("Player added!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error adding player:", error);
      setMessage("Error adding player");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
    setEditingPlayerPoints(player.points.toString());
  };

  const handleCancelEditPlayer = () => {
    setEditingPlayerId(null);
    setEditingPlayerName("");
    setEditingPlayerPoints("");
  };

  const handleSavePlayer = async (playerId: string) => {
    if (!editingPlayerName.trim()) return;
    
    try {
      setIsSaving(true);
      const points = parseInt(editingPlayerPoints) || 0;
      await updatePlayer(playerId, {
        name: editingPlayerName.trim(),
        points,
      });
      await loadClubAndPlayers();
      setEditingPlayerId(null);
      setMessage("Player updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating player:", error);
      setMessage("Error updating player");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return;
    
    try {
      setIsSaving(true);
      await deletePlayer(playerId);
      await loadClubAndPlayers();
      setMessage("Player deleted!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting player:", error);
      setMessage("Error deleting player");
    } finally {
      setIsSaving(false);
    }
  };

  // Login screen
  if (showLogin && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-primary-800 mb-6 text-center">Club Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-earth-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Club not found
  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-earth-600">Club not found</p>
        </div>
      </div>
    );
  }

  // Main admin interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-primary-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-primary-800">Club Management</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-primary-700 hover:text-primary-800 font-medium text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes("Error")
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-green-50 text-green-800 border border-green-200"
          }`}>
            {message}
          </div>
        )}

        {/* Club Name Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <Users className="h-6 w-6 text-primary-700" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-earth-700 mb-2">
                Club Name
              </label>
              {editingClubName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isSavingClub}
                  />
                  <button
                    onClick={handleSaveClubName}
                    disabled={isSavingClub || !clubName.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingClubName(false);
                      setClubName(club?.name || "");
                    }}
                    disabled={isSavingClub}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-primary-800">{club?.name}</h2>
                  <button
                    onClick={() => setEditingClubName(true)}
                    className="px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg border border-primary-200 hover:border-primary-300 font-medium flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Name
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary-700" />
              <h2 className="text-xl font-bold text-primary-800">Players</h2>
              <span className="text-sm text-earth-600">({players.length})</span>
            </div>
            {!showAddPlayer && (
              <button
                onClick={() => setShowAddPlayer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                <Plus className="h-5 w-5" />
                Add Player
              </button>
            )}
          </div>

          {/* Add Player Form */}
          {showAddPlayer && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h3 className="text-lg font-semibold text-primary-800 mb-4">Add New Player</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={newPlayerPoints}
                    onChange={(e) => setNewPlayerPoints(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleAddPlayer}
                    disabled={isSaving || !newPlayerName.trim()}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
                  >
                    {isSaving ? "Adding..." : "Add Player"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPlayer(false);
                      setNewPlayerName("");
                      setNewPlayerPoints("");
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Players List */}
          {players.length === 0 ? (
            <div className="text-center py-12 text-earth-600">
              <Users className="h-12 w-12 mx-auto mb-4 text-earth-400" />
              <p className="text-lg">No players yet.</p>
              <p className="text-sm mt-2">Click "Add Player" to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="p-4 bg-white rounded-lg border border-primary-200 hover:shadow-md transition-shadow">
                  {editingPlayerId === player.id ? (
                    // Edit mode
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-earth-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editingPlayerName}
                          onChange={(e) => setEditingPlayerName(e.target.value)}
                          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-earth-700 mb-2">
                          Points
                        </label>
                        <input
                          type="number"
                          value={editingPlayerPoints}
                          onChange={(e) => setEditingPlayerPoints(e.target.value)}
                          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button
                          onClick={() => handleSavePlayer(player.id)}
                          disabled={isSaving || !editingPlayerName.trim()}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditPlayer}
                          disabled={isSaving}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary-800 text-lg">{player.name}</h3>
                        <p className="text-sm text-earth-600">Points: {player.points}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEditPlayer(player)}
                          className="px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg border border-primary-200 hover:border-primary-300 font-medium flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 font-medium flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
