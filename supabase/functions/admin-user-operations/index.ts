import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header to verify the caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a client with the user's token to verify they are super_admin
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the user is a super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single()

    if (roleError || !roleData) {
      console.error('User is not a super_admin:', roleError)
      return new Response(
        JSON.stringify({ error: 'Forbidden - Only super admins can perform this action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, user_id, new_password, profile_id, admin_password } = await req.json()

    // Get admin email for password verification
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const adminEmail = adminProfile?.email || user.email
    console.log(`Admin operation requested: ${action} for user_id: ${user_id}`)

    if (action === 'delete_user') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent deleting yourself
      if (user_id === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Deleting user: ${user_id}`)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

      if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`User ${user_id} deleted successfully`)
      return new Response(
        JSON.stringify({ success: true, message: 'User deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update_password') {
      if (!user_id || !new_password) {
        return new Response(
          JSON.stringify({ error: 'user_id and new_password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Updating password for user: ${user_id}`)
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { password: new_password }
      )

      if (updateError) {
        console.error('Error updating password:', updateError)
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Password updated for user ${user_id}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete_teacher') {
      if (!profile_id) {
        return new Response(
          JSON.stringify({ error: 'profile_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!admin_password) {
        return new Response(
          JSON.stringify({ error: 'admin_password is required for security verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent deleting yourself
      if (profile_id === user.id) {
        return new Response(
          JSON.stringify({ error: 'No puede eliminar su propia cuenta' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify admin password by attempting to sign in
      console.log(`Verifying admin password for: ${adminEmail}`)
      const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: adminEmail!,
        password: admin_password
      })

      if (signInError) {
        console.error('Password verification failed:', signInError.message)
        return new Response(
          JSON.stringify({ error: 'Contraseña incorrecta' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Password verified. Deleting teacher profile: ${profile_id}`)

      // Delete related data first (inscriptions, user_roles, etc.)
      // Delete inscriptions
      const { error: inscriptionsError } = await supabaseAdmin
        .from('inscriptions')
        .delete()
        .eq('user_id', profile_id)

      if (inscriptionsError) {
        console.error('Error deleting inscriptions:', inscriptionsError)
      }

      // Delete user roles
      const { error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', profile_id)

      if (rolesError) {
        console.error('Error deleting user roles:', rolesError)
      }

      // Delete profile documents
      const { error: profileDocsError } = await supabaseAdmin
        .from('profile_documents')
        .delete()
        .eq('user_id', profile_id)

      if (profileDocsError) {
        console.error('Error deleting profile documents:', profileDocsError)
      }

      // If user has auth account (user_id in profile matches auth user), delete auth user
      if (user_id) {
        console.log(`Deleting auth user: ${user_id}`)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError)
          // Continue anyway to delete profile
        }
      }

      // Delete profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', profile_id)

      if (profileError) {
        console.error('Error deleting profile:', profileError)
        return new Response(
          JSON.stringify({ error: profileError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Teacher ${profile_id} deleted successfully`)
      return new Response(
        JSON.stringify({ success: true, message: 'Docente eliminado exitosamente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "delete_user", "update_password", or "delete_teacher"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
